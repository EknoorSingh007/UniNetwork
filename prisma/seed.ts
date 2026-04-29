import { prisma } from '../lib/prisma';

const universities = [
  { name: 'Stanford University', domain: 'stanford.edu' },
  { name: 'Massachusetts Institute of Technology', domain: 'mit.edu' },
  { name: 'Harvard University', domain: 'harvard.edu' },
  { name: 'University of California, Berkeley', domain: 'berkeley.edu' },
  { name: 'Local State University', domain: 'state.edu' },
];

async function main() {
  console.log('Seeding universities...');
  
  for (const uni of universities) {
    const createdUni = await prisma.university.upsert({
      where: { domain: uni.domain },
      update: {},
      create: {
        name: uni.name,
        domain: uni.domain,
        communities: {
          create: {
            name: `${uni.name} Community`,
            description: `The main community for ${uni.name}.`,
            isMain: true,
          }
        }
      },
    });
    console.log(`Created university: ${createdUni.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
