Session id flöde
1. Guide öppnar controllern
2. Controller genererar session ID (datum + random suffix)
3. Controller visar QR-kod + ansluter till backend med ID:t
4. Turister sätter på headset, guide håller upp telefonen
5. Headset skannar QR → öppnar client-URL med ?session=...
6. Client ansluter till backend med samma ID
7. Guide trycker på scen → alla headset reagerar

# Notes
- För enkelt att trycka på varje scene, swipe istället för tryck?
- spara session i localstorage för persistent
- Visa session på MainPage? behövs?