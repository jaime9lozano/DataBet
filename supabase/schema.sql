create extension if not exists pgcrypto;

create table if not exists app_users (
    id uuid primary key default gen_random_uuid(),
    auth_uid uuid not null unique,
    display_name text not null,
    base_currency char(3) not null default 'EUR',
    timezone text not null default 'Europe/Madrid',
    created_at timestamptz not null default now()
);

create table if not exists bankrolls (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    name text not null,
    currency char(3) not null default 'EUR',
    balance numeric(14,2) not null default 0,
    target_stake_unit numeric(14,2) not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists bankroll_movements (
    id uuid primary key default gen_random_uuid(),
    bankroll_id uuid not null references bankrolls(id) on delete cascade,
    type text not null check (type in ('deposit','withdrawal','transfer_in','transfer_out')),
    amount numeric(14,2) not null,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists bookmakers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    country text not null,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    sport text not null,
    league text not null,
    home_competitor text not null,
    away_competitor text not null,
    start_at timestamptz not null,
    status text not null default 'scheduled',
    created_at timestamptz not null default now()
);

create table if not exists markets (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    kind text not null,
    description text not null,
    line numeric(10,2),
    created_at timestamptz not null default now()
);

create table if not exists bets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    bankroll_id uuid not null references bankrolls(id) on delete cascade,
    event_id uuid references events(id),
    market_id uuid references markets(id),
    bookmaker_id uuid references bookmakers(id),
    stake numeric(14,2) not null,
    odds numeric(10,3) not null,
    implied_probability numeric(5,3),
    status text not null default 'pending',
    bet_type text not null default 'single',
    placed_at timestamptz not null,
    settled_at timestamptz,
    result_amount numeric(14,2),
    notes text,
    tags text[] default array[]::text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function set_bet_user_id()
returns trigger as $$
begin
    if new.user_id is null then
        select b.user_id into new.user_id from bankrolls b where b.id = new.bankroll_id;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger bets_set_user_id
before insert on bets
for each row execute function set_bet_user_id();

create table if not exists bet_legs (
    id uuid primary key default gen_random_uuid(),
    bet_id uuid not null references bets(id) on delete cascade,
    market_id uuid references markets(id),
    selection text not null,
    odds numeric(10,3) not null,
    result_amount numeric(14,2),
    created_at timestamptz not null default now()
);

create table if not exists odds_history (
    id uuid primary key default gen_random_uuid(),
    bet_id uuid references bets(id) on delete cascade,
    market_id uuid references markets(id),
    bookmaker_id uuid references bookmakers(id),
    price numeric(10,3) not null,
    recorded_at timestamptz not null default now(),
    source text not null default 'manual'
);

create table if not exists tags (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references app_users(id) on delete cascade,
    name text not null,
    color text,
    created_at timestamptz not null default now()
);

create table if not exists bet_tags (
    bet_id uuid not null references bets(id) on delete cascade,
    tag_id uuid not null references tags(id) on delete cascade,
    primary key (bet_id, tag_id)
);

create table if not exists attachments (
    id uuid primary key default uuid_generate_v4(),
    bet_id uuid not null references bets(id) on delete cascade,
    storage_path text not null,
    mime_type text not null,
    created_at timestamptz not null default now()
);

create view if not exists bet_performance_by_period as
    select
        bankroll_id,
        date_trunc('month', placed_at) as period,
        count(*) as total_bets,
        sum(stake) as total_staked,
        sum(coalesce(result_amount, 0)) as profit,
        case when sum(stake) = 0 then 0 else sum(coalesce(result_amount, 0)) / sum(stake) end as roi
    from bets
    group by bankroll_id, date_trunc('month', placed_at);

create view if not exists clv_summary as
    select
        b.id as bet_id,
        b.odds as opening_odds,
        (select price from odds_history oh where oh.bet_id = b.id order by recorded_at desc limit 1) as closing_odds,
        case
            when (select price from odds_history oh where oh.bet_id = b.id order by recorded_at desc limit 1) is null then null
            else (b.odds - (select price from odds_history oh where oh.bet_id = b.id order by recorded_at desc limit 1))
        end as clv_delta
    from bets b;

create view if not exists bankroll_equity_curve as
    select
        bankroll_id,
        placed_at::date as day,
        sum(coalesce(result_amount, 0)) over (partition by bankroll_id order by placed_at rows between unbounded preceding and current row) as cumulative_profit
    from bets;
