import { Global, Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { guestEncryptionExtension } from './guest-encryption.extension';
import { softDeleteExtension } from './soft-delete.extension';

// CH-004 — le client réellement injecté partout sous le token PrismaService
// est le client Prisma étendu (chiffrement transparent de
// Guest.pieceIdentite, voir guest-encryption.extension.ts ; filtrage
// soft-delete centralisé, CH-006, voir soft-delete.extension.ts), pas une
// instance de la classe PrismaService elle-même : $extends() renvoie un
// nouvel objet (proxy), qui ne peut pas être obtenu en instanciant la classe
// directement (`new PrismaService()`). PrismaService reste la forme/le type
// utilisés par tous les services consommateurs
// (`constructor(private prisma: PrismaService)`) — seule cette fabrique
// change, jamais les sites d'appel. Les deux extensions sont chaînées
// (`$extends().$extends()`) — vérifié en live que la composition ne casse
// ni le chiffrement (CH-004) ni le filtrage soft-delete (CH-006) l'un pour
// l'autre.
@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (): PrismaService => {
        let dbUrl = process.env.DATABASE_URL;
        let resolvedPath = '';
        if (dbUrl && dbUrl.startsWith('file:')) {
          const rawPath = dbUrl.replace('file:', '');
          if (fs.existsSync(rawPath)) {
            resolvedPath = path.resolve(rawPath);
          } else if (fs.existsSync(path.join('backend', rawPath))) {
            resolvedPath = path.resolve('backend', rawPath);
          } else if (fs.existsSync(path.join('/app/applet/backend', rawPath))) {
            resolvedPath = '/app/applet/backend/' + rawPath;
          }
        }
        if (!resolvedPath) {
          if (fs.existsSync('/app/applet/backend/prisma/dev.db')) {
            resolvedPath = '/app/applet/backend/prisma/dev.db';
          } else if (fs.existsSync('backend/prisma/dev.db')) {
            resolvedPath = path.resolve('backend/prisma/dev.db');
          } else if (fs.existsSync('prisma/dev.db')) {
            resolvedPath = path.resolve('prisma/dev.db');
          } else {
            resolvedPath = path.resolve('backend/prisma/dev.db');
          }
        }
        dbUrl = `file:${resolvedPath}`;
        if (dbUrl.includes(':3307')) {
          dbUrl = dbUrl.replace(':3307', ':3306');
        }
        const client = new PrismaClient({
          datasources: {
            db: {
              url: dbUrl,
            },
          },
          // CH-010 — pieceIdentiteHash (index aveugle HMAC, RD-011) n'est
          // jamais destiné à être lu par du code applicatif ni renvoyé par
          // l'API : `omit` global (Prisma 6, GA) l'exclut de tout résultat
          // par défaut, quel que soit le service appelant — même garantie
          // structurelle que le filtrage soft-delete (CH-006), pas une
          // discipline manuelle par endpoint.
          omit: { guest: { pieceIdentiteHash: true } },
        })
          .$extends(guestEncryptionExtension(process.env.ENCRYPTION_KEY))
          .$extends(softDeleteExtension());
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return client as any;
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
