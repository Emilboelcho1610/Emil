---
name: new-campaign
description: Opret en komplet email-kampagne i Klaviyo fra brief til schedulér. Brug når brugeren siger "lav ny kampagne", "opret BF-kampagne", "kør en email ud" eller lignende.
---

# Skill: ny kampagne i Klaviyo

Følg disse skridt i rækkefølge. Stop og spørg brugeren hvis noget mangler.

## 1. Saml briefen

Tjek at du har:
- **Formål**: salg, traffic, awareness, vinde tilbage?
- **Målgruppe**: liste-id eller segment-id (kald `list_segments` / `list_lists` hvis ukendt)
- **Send-tidspunkt**: ISO-8601 i UTC
- **Afsender**: from_email + from_label
- **Subject + preview-tekst**
- **Indhold**: enten eksisterende template_id, eller HTML der skal blive til ny template

Mangler noget — spørg brugeren én gang samlet, ikke ét felt ad gangen.

## 2. Template

- Hvis brugeren leverer HTML (typisk fra et claude.ai Artifact): kald `create_template` med navn `{kampagne}-{dato}` og gem template_id
- Ellers brug eksisterende `template_id`

## 3. Kampagne

Kald `create_campaign` med:
- name = "{Brand} – {Kampagne} – {dato}"
- subject, from_email, from_label, template_id, list_or_segment_id

Gem campaign_id og campaign_message_id fra response.

## 4. Test før schedulering

- Kald `send_campaign_test` med campaign_message_id og brugerens email
- Bed brugeren bekræfte at testen ser korrekt ud

## 5. Schedulér

Først når brugeren har bekræftet testen:
- Kald `schedule_campaign` med campaign_id og send_at
- Vis sammenfatning: navn, modtager-segment, tidspunkt, link til Klaviyo-UI

## 6. Optional — opfølgning

Tilbyd brugeren at:
- Bygge et send-2-flow til ikke-åbnere (efter 48 timer)
- Tracke åbnings/klik-rate efter send (`get_metric_aggregate`)

## Vigtigt

- Schedulér ALDRIG før test er godkendt af brugeren
- Hvis target-segmentet er stort (>50.000 profiler), spørg eksplicit om bekræftelse
- Foreslå altid en preview-tekst hvis brugeren ikke har givet en
