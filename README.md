# portfolio

## Lancement local

1. Copier `.env.example` en `.env`.
2. Renseigner `CONTACT_TO` avec l'adresse qui doit recevoir les messages.
3. Renseigner les variables SMTP avec les identifiants d'un serveur mail sortant.
4. Installer les dépendances : `npm install`
5. Lancer en local avec Netlify :
   ```bash
   npm run dev
   ```
   Cela va lancer `netlify dev` sur `http://localhost:8888`.

Le fichier `.env` est ignoré par Git, donc ton mot de passe ne part pas au push.

Le formulaire envoie les messages via une Netlify Function sur l'endpoint `/api/contact`.

## Configuration Gmail

Si tu veux utiliser ton adresse Gmail pour envoyer les messages:

```env
CONTACT_TO=codognan.thomas.pro@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=codognan.thomas.pro@gmail.com
SMTP_PASS=ton-mot-de-passe-d-application
SMTP_FROM="Portfolio <codognan.thomas.pro@gmail.com>"
```

Il faut un mot de passe d'application Gmail, pas ton mot de passe principal.

## Déploiement sur Netlify

1. Envoyer ton code sur GitHub.
2. Sur [Netlify](https://app.netlify.com) :
    - Clique sur **Add new site** puis **Import an existing project**
    - Connecte ton repo GitHub
    - Garde les réglages par défaut, Netlify lira `netlify.toml`
    - Ajoute les variables d'environnement dans **Site configuration** → **Environment variables** :
       - `CONTACT_TO`
       - `SMTP_HOST`
       - `SMTP_PORT`
       - `SMTP_SECURE`
       - `SMTP_USER`
       - `SMTP_PASS`
       - `SMTP_FROM`
    - Lance le déploiement
3. Une fois le site publié, teste le formulaire sur l'URL Netlify fournie.

Si le contact ne marche pas, ouvre **Site logs** puis vérifie aussi le test direct de la fonction avec `netlify dev` en local.
