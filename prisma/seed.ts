import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Seeds studios + equipment only.
 * Users live in Supabase Auth + public.users (trigger); create them in the Supabase dashboard or via sign-up.
 */
async function main() {
  console.log("🌱 Seeding database (studios + equipment)...")

  await prisma.studio.upsert({
    where: { name: "Studio A - Recording" },
    update: {},
    create: {
      name: "Studio A - Recording",
      description:
        "Professional recording studio equipped with high-end analog and digital gear for music production, mixing, and mastering.",
      location: null,
      capacity: null,
      images: [],
    },
  })

  await prisma.studio.upsert({
    where: { name: "Studio B - Recording" },
    update: {},
    create: {
      name: "Studio B - Recording",
      description:
        "Recording studio with digital mixer and modern equipment for band recording and live sessions.",
      location: null,
      capacity: null,
      images: [],
    },
  })

  await prisma.studio.upsert({
    where: { name: "Creative Space - Practice" },
    update: {},
    create: {
      name: "Creative Space - Practice",
      description:
        "Open creative space for individual practice, small ensemble rehearsals, and creative work.",
      location: null,
      capacity: null,
      images: [],
    },
  })

  console.log("✅ Studios upserted")

  const cables = [
    { name: "5m XLR Cable Microphone Male - Female (Stagg)", quantity: 7, category: "Cables" },
    { name: "2m XLR to Mini TRS Cable", quantity: 1, category: "Cables" },
    { name: "5m XLR Cable Microphone Male - Female (Proel)", quantity: 5, category: "Cables" },
    { name: "3m XLR - TRS Cable", quantity: 4, category: "Cables" },
    { name: "0.5m XLR Cable Microphone Male - Female", quantity: 2, category: "Cables" },
    { name: "5m XLR Cable Speaker Output Male - Female", quantity: 13, category: "Cables" },
    { name: "5m Headphone Out 3.5mm Extension", quantity: 1, category: "Cables" },
    { name: "3m Headphone Out 3.5mm Extension", quantity: 1, category: "Cables" },
  ]

  const microphones = [
    { name: "Shure SM57", quantity: 2, category: "Microphone" },
    { name: "AKG P220", quantity: 1, category: "Microphone" },
    { name: "Rode M3", quantity: 2, category: "Microphone" },
    { name: "Mipro Wireless A (switcher broken, low gain)", quantity: 1, category: "Microphone" },
    { name: "Mipro Wireless B", quantity: 1, category: "Microphone" },
    { name: "AKG P4 Dynamic", quantity: 4, category: "Microphone" },
    { name: "AKG P2 Dynamic", quantity: 1, category: "Microphone" },
    { name: "AKG P17 SC", quantity: 2, category: "Microphone" },
    { name: "Talk Back Mic BM 400", quantity: 1, category: "Microphone" },
    { name: "Rode NTG (boom)", quantity: 1, category: "Microphone" },
    { name: "Audio Technica AT2050", quantity: 1, category: "Microphone" },
    { name: "Boya WM6 Lavilier mic wireless", quantity: 1, category: "Microphone" },
  ]

  const equipment = [
    { name: "Steinberg UR 824 - Audio Interface", quantity: 1, category: "Audio Interface" },
    { name: "FURMAN PL8 CE Power Conditioner", quantity: 1, category: "Power" },
    { name: "Yamaha HS 8 - Speaker Active", quantity: 2, category: "Speaker" },
    { name: "Behringer Powerplay Pro XL HA4700 Headphone Amp", quantity: 1, category: "Headphone Amp" },
    { name: "Novation Launchkey 49 Mk2 Midi Controller", quantity: 1, category: "MIDI Controller" },
    { name: "SENNHEISER HD 206 Headphone", quantity: 4, category: "Headphone" },
    { name: "Mixer Yamaha MG 16XU", quantity: 1, category: "Mixer" },
    { name: "MIPRO wireless receiver 2 channels", quantity: 1, category: "Wireless Receiver" },
    { name: "Yamaha DBR 15 active Speaker", quantity: 2, category: "Speaker" },
    { name: "Zoom H6 Set", quantity: 1, category: "Recorder" },
    { name: "Yamaha Mixer TF 1 - Digital", quantity: 1, category: "Mixer" },
    { name: "Alesis Microverb", quantity: 1, category: "Effects" },
    { name: "SPL Equalizer 230 BBE Stereo", quantity: 1, category: "Equalizer" },
    { name: "Furman PL8", quantity: 1, category: "Power" },
    { name: "Behringer UMC404", quantity: 1, category: "Audio Interface" },
    { name: "Speaker Behringer Ribbon 1 Truth B3021A", quantity: 2, category: "Speaker" },
  ]

  const accessories = [
    { name: "Stand Mic MK 10 Samson", quantity: 6, category: "Accessory" },
    { name: "Pop Filter", quantity: 3, category: "Accessory" },
    { name: "Stand Mic Samson BL-3", quantity: 2, category: "Accessory" },
    { name: "Pro Tools 12 Subscriptions Ilok", quantity: 2, category: "Software" },
    { name: "Behringer ultra G -DI Box", quantity: 2, category: "DI Box" },
    { name: "Boom Pole Boya PB25", quantity: 1, category: "Accessory" },
    { name: "Solder Kit", quantity: 1, category: "Tool" },
    { name: "Behringer ultra DI DI100", quantity: 2, category: "DI Box" },
    { name: "Behringer HA400", quantity: 1, category: "Headphone Amp" },
  ]

  const allEquipment = [...cables, ...microphones, ...equipment, ...accessories]

  for (const equip of allEquipment) {
    await prisma.equipment.upsert({
      where: { name: equip.name },
      update: {},
      create: {
        name: equip.name,
        quantity: equip.quantity,
        available: equip.quantity,
        category: equip.category,
        description: `UIC Music Inventory - ${equip.category}`,
      },
    })
  }

  console.log(`✅ Equipment upserted (${allEquipment.length} items)`)
  console.log("\n👤 Users: create via Supabase Auth (sign-in page) or SQL; public.users is filled by trigger.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
