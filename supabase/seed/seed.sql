insert into app_users (auth_uid, display_name)
values
    ('11111111-1111-1111-1111-111111111111', 'Demo User')
on conflict do nothing;

insert into bankrolls (user_id, name, currency, balance, target_stake_unit)
select id, 'Principal', 'EUR', 1000, 10 from app_users
on conflict do nothing;

insert into bookmakers (name, country)
values
    ('Bet365', 'UK'),
    ('Pinnacle', 'Curacao'),
    ('Betfair', 'MT')
on conflict do nothing;
