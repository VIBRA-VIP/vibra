import { PrismaClient, ProfileGender, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const femaleModels = [
  {
    email: 'camila@vibra.app',
    username: 'camila',
    displayName: 'Camila',
    age: 25,
    bio: 'Latina curvy, me encanta conectar y disfrutar el momento. Chat y videollamadas calientes.',
    tags: ['Latina', 'Curvy', 'Coqueta', 'Tatuajes', 'Morena'],
    attributes: {
      height: 'Media (1.65m)',
      bodyType: 'Curvy',
      skinTone: 'Morena',
      bust: '95C',
      waist: '68cm',
      hips: '102cm',
      tattoos: 'Sí — espalda y muslo',
      hair: 'Negro largo',
      vibe: 'Coqueta y dominante suave',
    },
    online: true,
    rating: 4.9,
    chat: 15,
    video: 80,
  },
  {
    email: 'valentina@vibra.app',
    username: 'valentina',
    displayName: 'Valentina',
    age: 23,
    bio: 'Delgada, alta y juguetona. Ideal para videollamadas largas.',
    tags: ['Alta', 'Delgada', 'Clara', 'Piercings'],
    attributes: {
      height: 'Alta (1.75m)',
      bodyType: 'Delgada',
      skinTone: 'Clara',
      bust: '85B',
      waist: '60cm',
      hips: '88cm',
      tattoos: 'No',
      hair: 'Castaño',
      vibe: 'Dulce y traviesa',
    },
    online: true,
    rating: 4.8,
    chat: 20,
    video: 90,
  },
  {
    email: 'isabella@vibra.app',
    username: 'isabella',
    displayName: 'Isabella',
    age: 27,
    bio: 'Morena tatuada, curvas marcadas y mucha actitud.',
    tags: ['Morena', 'Tatuada', 'Curvy', 'Dominante'],
    attributes: {
      height: 'Media (1.68m)',
      bodyType: 'Curvy',
      skinTone: 'Morena',
      bust: '100D',
      waist: '70cm',
      hips: '108cm',
      tattoos: 'Sí — brazos y costado',
      hair: 'Negro ondulado',
      vibe: 'Intensa y seductora',
    },
    online: false,
    rating: 4.7,
    chat: 15,
    video: 70,
  },
];

const maleModels = [
  {
    email: 'mateo@vibra.app',
    username: 'mateo',
    displayName: 'Mateo',
    age: 26,
    bio: 'Moreno, delgado y bien dotado. Listo para chat privado o video.',
    tags: ['Moreno', 'Delgado', 'Dotado', 'Tatuado'],
    attributes: {
      height: 'Alto (1.82m)',
      bodyType: 'Delgado atlético',
      skinTone: 'Moreno',
      penisSize: '19 cm',
      penisGirth: 'Grueso / piñudo',
      tattoos: 'Sí — pecho y brazo',
      hair: 'Corto oscuro',
      vibe: 'Directo y caliente',
    },
    online: true,
    rating: 4.8,
    chat: 18,
    video: 85,
  },
  {
    email: 'lucas@vibra.app',
    username: 'lucas',
    displayName: 'Lucas',
    age: 24,
    bio: 'Musculoso, piel clara y muy juguetón en videollamada.',
    tags: ['Musculoso', 'Claro', 'Versátil'],
    attributes: {
      height: 'Medio (1.78m)',
      bodyType: 'Musculoso',
      skinTone: 'Clara',
      penisSize: '17 cm',
      penisGirth: 'Medio-grueso',
      tattoos: 'No',
      hair: 'Castaño',
      vibe: 'Amigable y explícito',
    },
    online: true,
    rating: 4.6,
    chat: 15,
    video: 75,
  },
  {
    email: 'diego@vibra.app',
    username: 'diego',
    displayName: 'Diego',
    age: 28,
    bio: 'Moreno piñudo, voz grave y mucha energía.',
    tags: ['Moreno', 'Piñudo', 'Dominante', 'Barba'],
    attributes: {
      height: 'Alto (1.85m)',
      bodyType: 'Atlético',
      skinTone: 'Moreno',
      penisSize: '20 cm',
      penisGirth: 'Muy grueso / piñudo',
      tattoos: 'Sí — hombro',
      hair: 'Negro con barba',
      vibe: 'Dominante y explícito',
    },
    online: false,
    rating: 4.9,
    chat: 22,
    video: 95,
  },
];

const defaultServices = (chat: number, video: number) => [
  { name: 'Chat privado', price: chat, unit: 'créditos/min' },
  { name: 'Video llamada', price: video, unit: 'créditos/min' },
  { name: 'Mensaje prioritario', price: 30, unit: 'créditos' },
  { name: 'Contenido exclusivo', price: 100, unit: 'desde' },
];

async function upsertModel(
  model: (typeof femaleModels)[0],
  gender: ProfileGender,
  passwordHash: string,
) {
  const user = await prisma.user.upsert({
    where: { email: model.email },
    update: {
      role: UserRole.MODEL,
      profile: {
        update: {
          displayName: model.displayName,
          username: model.username,
          bio: model.bio,
          age: model.age,
          gender,
          tags: model.tags,
          attributes: model.attributes,
          services: defaultServices(model.chat, model.video),
          isOnline: model.online,
          isAvailable: model.online,
          isVerified: true,
          rating: model.rating,
          ratingCount: 120,
          chatPricePerMin: model.chat,
          videoPricePerMin: model.video,
          avatarUrl: null,
        },
      },
    },
    create: {
      email: model.email,
      passwordHash,
      role: UserRole.MODEL,
      emailVerified: true,
      profile: {
        create: {
          displayName: model.displayName,
          username: model.username,
          bio: model.bio,
          age: model.age,
          gender,
          tags: model.tags,
          attributes: model.attributes,
          services: defaultServices(model.chat, model.video),
          isOnline: model.online,
          isAvailable: model.online,
          isVerified: true,
          rating: model.rating,
          ratingCount: 120,
          chatPricePerMin: model.chat,
          videoPricePerMin: model.video,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });
  console.log(`Seeded model: ${user.email}`);
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@vibra.app' },
    update: {},
    create: {
      email: 'admin@vibra.app',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Admin Vibra',
          username: 'admin',
          bio: 'Administrador de la plataforma',
          isVerified: true,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });
  console.log('Seeded admin user: admin@vibra.app');

  for (const m of femaleModels) {
    await upsertModel(m, ProfileGender.FEMALE, passwordHash);
  }
  for (const m of maleModels) {
    await upsertModel(m, ProfileGender.MALE, passwordHash);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
