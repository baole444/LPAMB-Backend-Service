# LPAMB Backend Service
A backend service server that handle request from [La Petite A Musix Box App](https://github.com/baole444/LaPetiteAMusixBox/releases/latest).

**This README is under construction**

## Page index:
1. [Database](#database)
    - [Script](#sql-script)
    - [Account](#services-database-account)
2. [Hosting](#service-hosting)
    - [Certificates](#https-certificate)
3. [Running the service](#service-operation)
    - [Requirement](#requirement)
    - [Configuration](#configuration)
    - [Music storage](#music-files)

## Database:
The service use MySql Server to store user's data and music information.<br>
You can download the installer [Here](https://dev.mysql.com/downloads/installer/).<br>
We suggest you also install [MySql Workbench](https://www.mysql.com/products/workbench/) for easy creation of database.

### SQL Script:
```sql
create database lpamb_track_data;

use lpamb_track_data;

create table artist (
    artist_id char(36) primary key default (UUID()),
    name varchar(100) not null,
    info text,
    created_at timestamp default current_timestamp
);

create table album (
    album_id CHAR(36) primary key default (UUID()),
    name varchar(100) not null,
    release_date date,
    created_at timestamp default current_timestamp
);

create table music (
    track_id char(36) primary key default (UUID()),
    title varchar(100) not null,
    artist_id char(36),
    album_id char(36),
    genre varchar(50),
    file_path varchar(255),
    created_at timestamp default current_timestamp,
    foreign key (artist_id) references artist(artist_id) on delete cascade,
    foreign key (album_id) references album(album_id) on delete cascade
);

create table users (
    user_id char(36) primary key default (UUID()),
    email varchar(255) unique not null collate utf8mb4_0900_bin, 
    username varchar(100) not null,
    password_hash varchar(255) not null collate utf8mb4_0900_bin,
    token varchar(255) collate utf8mb4_0900_bin,
    created_at timestamp default current_timestamp
);
```

> [!NOTE]<br>
> Tested on MySQL community Server - GPL version `8.0.39`.<br>
> Make sure to test for any change in syntax if using older/newer version.

### Service's database account:
On first run the service will try to create it's MySql user provided in
`connection.yml`.

The root's information will not be store on server and will be dispose after server's account creation done.

> [!CAUTION]<br>
> Using root account for the service is highly unadvised. This is to prevent injection from spreading beyond the limit of the account.
> The service will create an account with privileges limited to the database specified in `connection.yml`.

## Service hosting:
By default the serice use `https` at `https://localhost:25565`, however this will cause failure unless you have a certificate from trusted source. 

You can use [Ngrok service](https://ngrok.com/) with [Agent](https://ngrok.com/docs/agent/) to host the service. Ngrok now provide a free static domain for your account that can be use to expose your service to the internet.

In termial run:
```bash
ngrok http https://localhost:25565 --url=example-domain.ngrok-free.app 
```
- `https://localhost:25565` is LPAMB local address.
- `--url=<domain>` is your provided static domain.

Alternatively you can write a script to execute the command for you:

```bash
@echo off
echo Ngrok tunneling
:: Start server
ngrok http https://localhost:25565 --url=example-domain.ngrok-free.app 

pause
```

### Https Certificate:
Certificate of the service for encrytion is stored in `./config/cer`. If you are using Ngrok, they will cover the certificate for you.<br>
Alternatively you can self sign a certificate, however it will cause error when application try to connect to it.<br>
If possible use a certificate signed by trusted source.

The service will look for 3 file:
- cert.pem
- csr.pem
- key.pem

## Service operation:
### Requirement:
Make sure you installed `Node.js` before running the service.<br>

> [!NOTE]<br>
> It is recommended to use a node version manager to install `Node.js`.<br>
> You can read it further more on [npm installation note](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Make sure you prepared your [database](#database) before running.

### Configuration:
Service contains 2 configuration files.

`connection.yml`: store connection details for service to database and express's server details. Can be found in `./config/`
```yaml
mysql:
  host: 'localhost'
  user: 'LPAMB'
  password: 'LpamBroot'
  database: 'lpamb_track_data'
  connectionLimit: 100,
  maxIdle: 50,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 120000,
  port: 3306
server:
  port: 25565
  storage: 'storage'
  track: 'music'
  certificate: 'cer'
  config: 'config'
  response: 'response'
```

`encrypter.yml`: store salt length detail and **SECRECTS** for `JWT`. Can be found in `./userAuth/`
```yaml
security:
  salt: 8
  jwt_key_short: 'thi5|sLPAMBTot411yPr!v476Key'
  jwt_key_long: '@1ongTermKey4LPAMBSvM4keUxerAuthT0k6n'
```

> [!CAUTION]<br>
> The two `jwt_key_xyz` should be kept secrect. Exposure of these keys could lead to session takeover.<br>
> It is highly advised that you make your own keys to improve security.<br>
> Higher salt length will increase password hash strength but cost more computational power.

### Music files:
The service currently only support `mp3` format. The raw file should be store in directory where you config your `server.music` key in `connection.yml`.
By default it should be in `./storage/music`.

Music files store here will get their metadata stripped by the service on startup for better compatibility. 
This will only happened once, stripped files list are stored in `./storage/response/process.json`. Delete the `process.json` file or its content will cause service to perform stripping on startup or restart.

Music files that are used as response to play requests are stored in directory where you config your `server.response` key in `connection.yml`.
By default it should be in `./storage/response`.

**Command line support for inserting music is not possible right now, you can insert music's information to database manually.**

TBC
