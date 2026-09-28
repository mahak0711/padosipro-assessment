import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tasks = [
  // Home Cleaning
  { name: 'Full Home Deep Cleaning', category: 'Home Cleaning', description: 'One-time deep clean of kitchen, bathrooms, floors and dusting for the whole home.' },
  { name: 'Bathroom Cleaning', category: 'Home Cleaning', description: 'Scrubbing, descaling and sanitizing bathroom fixtures and tiles.' },
  { name: 'Kitchen Cleaning', category: 'Home Cleaning', description: 'Degreasing countertops, chimney, cabinets and appliances.' },
  { name: 'Sofa & Carpet Shampooing', category: 'Home Cleaning', description: 'Steam cleaning and shampooing sofas, carpets and rugs.' },
  { name: 'Balcony & Utility Cleaning', category: 'Home Cleaning', description: 'Sweeping, mopping and cobweb removal for balconies and utility areas.' },
  // Repairs & Maintenance
  { name: 'Plumbing Repair', category: 'Repairs & Maintenance', description: 'Fixing leaky taps, pipes, and blocked drains.' },
  { name: 'Electrical Repair', category: 'Repairs & Maintenance', description: 'Switchboard, wiring and light fixture repairs by a certified electrician.' },
  { name: 'AC Service & Repair', category: 'Repairs & Maintenance', description: 'Gas top-up, filter cleaning and general servicing of split or window ACs.' },
  { name: 'Appliance Repair', category: 'Repairs & Maintenance', description: 'Diagnosis and repair of washing machines, refrigerators and microwaves.' },
  { name: 'Carpentry & Furniture Fixing', category: 'Repairs & Maintenance', description: 'Door, drawer, hinge and furniture assembly or repair.' },
  // Errands & Shopping
  { name: 'Grocery Shopping', category: 'Errands & Shopping', description: 'Pick up groceries from a list and deliver them home.' },
  { name: 'Bill Payments', category: 'Errands & Shopping', description: 'Pay utility, rent or other recurring bills on your behalf.' },
  { name: 'Courier & Parcel Pickup', category: 'Errands & Shopping', description: 'Send or collect parcels and documents from a specified location.' },
  { name: 'Pharmacy Pickup', category: 'Errands & Shopping', description: 'Collect prescribed medicines from a nearby pharmacy.' },
  { name: 'Vehicle Fuel & Servicing Coordination', category: 'Errands & Shopping', description: 'Arrange refuelling or drop-off/pickup for vehicle servicing.' },
  // Personal & Family Care
  { name: 'Elderly Care Assistance', category: 'Personal & Family Care', description: 'Companionship and daily support for elderly family members.' },
  { name: 'Childcare & Babysitting', category: 'Personal & Family Care', description: 'Supervised care for children while you are away.' },
  { name: 'Pet Walking & Feeding', category: 'Personal & Family Care', description: 'Daily walks, feeding and basic care for pets.' },
  { name: 'Cook for a Day', category: 'Personal & Family Care', description: 'A cook prepares meals at home for the day as per your preference.' },
  { name: 'Event & Guest Assistance', category: 'Personal & Family Care', description: 'Help with setup, hosting and coordination for small home gatherings.' },
  // Moving & Setup
  { name: 'Packers & Movers Coordination', category: 'Moving & Setup', description: 'End-to-end coordination for packing, loading and shifting your home.' },
  { name: 'Furniture Assembly', category: 'Moving & Setup', description: 'Assembly of flat-pack furniture and fixtures in a new home.' },
  { name: 'Deep Move-in Cleaning', category: 'Moving & Setup', description: 'Thorough cleaning of a new home before you move in.' },
];

async function main() {
  console.log(`Seeding ${tasks.length} tasks...`);
  for (const task of tasks) {
    const existing = await prisma.task.findFirst({ where: { name: task.name, category: task.category } });
    if (!existing) {
      await prisma.task.create({ data: task });
    }
  }
  const count = await prisma.task.count();
  const categories = await prisma.task.findMany({ distinct: ['category'], select: { category: true } });
  console.log(`Done. ${count} tasks across ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
