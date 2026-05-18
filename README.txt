1. O co chodzi w tym projekcie? (Scenariusz i Biznes)
Budujesz System Zarządzania Profilami Użytkowników z modułem generowania raportów/avatarów.
Użytkownik loguje się, dostaje token JWT, może przeglądać swój profil oraz zlecić systemowi pobranie obrazka z internetu jako jego nowego avatara.

W tle dzieją się jednak kluczowe dla bezpieczeństwa procesy:

Izolacja sieciowa: Tylko jeden serwis (api-gateway) jest wystawiony na świat (port 8080). Pozostałe serwisy (user-service, renderer-service) żyją w zamkniętej, wewnętrznej sieci Dockera i nie można do nich uderzyć bezpośrednio z Twojego MacBooka.

Autoryzacja: Każde żądanie przechodzi przez Gateway, który sprawdza podpis JWT. Jeśli token jest poprawny, Gateway przekazuje żądanie dalej do wewnętrznej sieci.

Wektory ataków, które tutaj przećwiczysz:

SSRF (Server-Side Request Forgery): Użytkownik każe serwisowi renderer-service pobrać obrazek. Zamiast podać link do zewnętrznej strony (np. [http://zaufana-strona.pl/foto.png](http://zaufana-strona.pl/foto.png)), podaje wewnętrzny, ukryty adres Dockera: http://user-service:3000/admin/delete-user?id=1. Serwis renderujący, jako zaufany element sieci wewnętrznej, wykona to żądanie bez przeszkód, obchodząc zapory Gatewaya!

IDOR (Insecure Direct Object Reference): W user-service endpoint do pobierania danych profilu będzie wyglądał tak: /api/users/view?id=15. Atakujący, zmieniając id=15 na id=1, będzie mógł podejrzeć dane administratora, ponieważ aplikacja sprawdza tylko, czy użytkownik jest zalogowany (ma ważny JWT), ale nie sprawdza, czy ma prawo oglądać akurat ten konkretny profil.

2. Struktura katalogów projektu
Aby projekt był czytelny, łatwy w utrzymaniu i skalowalny, zastosujemy strukturę Mono-repozytorium (jedno repozytorium gita, a w nim osobne foldery dla każdego mikroserwisu).

Oto jak powinna wyglądać struktura plików w Twoim folderze Cloud-Native-Microservices:

Plaintext
Cloud-Native-Microservices/
│
├── .gitignore                      # Ignoruje node_modules, .env, logi itp.
├── README.md                       # Opis uruchomienia projektu
├── docker-compose.yml              # Główny plik konfiguracji całej infrastruktury
│
├── api-gateway/                    # 1. MIKROSERWIS: Brama sieciowa (np. Node.js lub Go)
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                   # Logika sprawdzania JWT i proxying żądań
│   └── .env
│
├── user-service/                   # 2. MIKROSERWIS: Zarządzanie użytkownikami (np. Python/FastAPI lub PHP)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                 # Endpointy /api/users/view (podatne na IDOR)
│   │   └── database.py             # Prosta baza danych (np. w pamięci lub SQLite)
│   └── .env
│
└── renderer-service/               # 3. MIKROSERWIS: Pobieranie i renderowanie zasobów (np. Node.js)
    ├── Dockerfile
    ├── package.json
    ├── server.js                   # Endpoint /api/render?url=... (podatny na SSRF)
    └── .env
3. Opis komponentów struktury
docker-compose.yml

To jest serce orkiestracji. Definiuje trzy kontenery, automatycznie tworzy dla nich wewnętrzną sieć (np. micro_network) i mapuje porty. Tylko dla api-gateway mapujesz port na zewnątrz (8080:8080). Pozostałe serwisy mają sekcję expose, co oznacza, że są widoczne tylko dla innych kontenerów w tej samej sieci.

api-gateway/

Działa jak strażnik. Jeśli przychodzi żądanie na http://localhost:8080/api/users/view?id=5, gateway:

Wyciąga nagłówek Authorization: Bearer <JWT>.

Weryfikuje klucz kryptograficzny tokenu.

Jeśli jest OK, przesyła to żądanie wewnętrznie pod adres http://user-service:3000/api/users/view?id=5.

user-service/

Zawiera logikę biznesową kont użytkowników. To tutaj przechowujesz flagi lub dane autoryzacyjne. Zaimplementujesz tu lukę IDOR. Serwis ten ufa, że skoro żądanie przeszło przez Gateway, to użytkownik jest zalogowany, i bezwiednie zwraca dane dowolnego usera na podstawie parametru id.

renderer-service/

Serwis narzędziowy. Przyjmuje parametr url, wykonuje pod maską żądanie HTTP (np. za pomocą biblioteki axios lub fetch), pobiera zawartość i ją przetwarza. Zaimplementujesz tu brak walidacji adresu URL (brak czarnej/białej listy adresów IP), co otworzy drzwi do ataku SSRF.
