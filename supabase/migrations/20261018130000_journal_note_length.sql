-- Dłuższe notatki w dzienniku: notatka z diagnozy AI (podsumowanie + wszystkie kroki)
-- ma najwyżej ok. 3650 znaków, więc limit rośnie z 500 do 4000
alter table public.plant_journal
  drop constraint plant_journal_note_check,
  add constraint plant_journal_note_check
    check (note is null or char_length(trim(note)) between 1 and 4000);
