**Small overview**

This project represents a cloud-native microservices implementation with common SSRF and IDOR vulnerabilities planted for learning purposes. Several services collaborate with each other via REST API, isolated inside a Docker internal network.

Main components are:

1. **API Gateway**, the only service exposed to the outside world (port 8080). Every request goes through it, and it validates the JWT signature before proxying the request further into the internal network. To run the whole stack use:

```
npm init -y
npm install express ejs crypto-js
node index.js
```

2. **User Service**, which holds the business logic for user accounts. It exposes an endpoint like:

```
/api/users/view?id=15
```
**To run:**
```
python3 app/main.py
```

This service trusts that if a request passed through the Gateway, the user is already authenticated — but it does **not** check whether the user is authorized to view that specific profile. Changing `id=15` to `id=1` lets you view another user's (e.g. admin's) data. That's the IDOR part.

3. **Renderer Service**, a utility service that fetches an image/resource from a URL provided by the user and processes it:

```
/api/render?url=...
```

**To get service off the land:**

```
npm init -y
npm install express ejs
node app.js
```

There's no validation (no IP blacklist/whitelist) on the provided URL, which opens the door to SSRF. Instead of passing a legit external link, you can point it at an internal, hidden Docker address, e.g.:

```
http://user-service:3000/admin/delete-user?id=1
```

Since `renderer-service` is treated as a trusted member of the internal network, it will happily execute that request — bypassing the Gateway's protections entirely.

Combined, these two vulnerabilities let an attacker use the renderer as a pivot to reach internal-only endpoints and manipulate accounts it should never have access to.

Note: only `api-gateway` is reachable from outside; `user-service` and `renderer-service` are not directly reachable from your host machine — only from within the Docker network.


