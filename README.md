# TennisHub Deployment

Hostinger hPanel Node.js deployment settings:

```text
Framework preset: Other
Root directory: .
Build command: npm run build
Output directory: dist
Entry file: apps/api/src/main.js
Package manager: npm
Node version: 20.x
```

Required environment variables:

```env
NODE_ENV=production
WEBSITE_DOMAIN=test.tennisplayerstory.com

MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-mysql-database

PB_SUPERUSER_EMAIL=zilin.zeng@google.com
PB_SUPERUSER_PASSWORD=Admin123456
JWT_SECRET=replace-with-a-long-random-secret
```

The app exposes a PocketBase-compatible API at `/hcgi/platform`, backed by MySQL. Existing frontend calls such as `pb.collection('articles').create(...)` continue to work through that compatibility layer.
