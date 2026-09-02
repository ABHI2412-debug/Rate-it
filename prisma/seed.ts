import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const demoPasswords = { admin: 'Admin@123!', user: 'User@123!', owner: 'Owner@123!' }
const stores = [
  ['Urban Brew Cafe and Roastery', 'hello@urbanbrew.example', 'Bandra West, Mumbai'], ['The Book Loft and Reading Room', 'hello@bookloft.example', 'Indiranagar, Bengaluru'],
  ['Pixel Electronics Experience', 'hello@pixelelectronics.example', 'Koramangala, Bengaluru'], ['Sunset Bistro and Supper Club', 'hello@sunsetbistro.example', 'Viman Nagar, Pune'],
  ['Green Basket Organic Market', 'hello@greenbasket.example', 'Hitech City, Hyderabad'], ['Nova Fashion House Studio', 'hello@novafashion.example', 'Hauz Khas, New Delhi'],
  ['Modern Home Studio Collective', 'hello@modernhome.example', 'Salt Lake, Kolkata'], ['Artisan Corner Makers Market', 'hello@artisancorner.example', 'Panampilly Nagar, Kochi'],
  ['Tech Haven Gadgets Store', 'hello@techhaven.example', 'Anna Nagar, Chennai'], ['Morning Bakery and Cafe', 'hello@morningbakery.example', 'Kalyani Nagar, Pune'],
  ['Coastal Kitchen Table', 'hello@coastalkitchen.example', 'Fort Kochi, Kerala'], ['The Plant Room Garden Shop', 'hello@plantroom.example', 'Alkapuri, Vadodara'],
] as const
const ownerData = [['owner@ratespace.demo', 'RateSpace Demo Store Owner Account'], ...Array.from({ length: 11 }, (_, index) => [`owner${index + 2}@ratespace.demo`, `RateSpace Store Owner Account ${index + 2}`])] as const

async function main() {
  const [adminPassword, userPassword, ownerPassword] = await Promise.all(Object.values(demoPasswords).map((value) => bcrypt.hash(value, 12)))
  const admin = await prisma.user.upsert({ where: { email: 'admin@ratespace.demo' }, update: { name: 'RateSpace Platform Administrator', password: adminPassword, role: 'ADMIN', address: 'RateSpace HQ, Mumbai' }, create: { name: 'RateSpace Platform Administrator', email: 'admin@ratespace.demo', password: adminPassword, role: 'ADMIN', address: 'RateSpace HQ, Mumbai' } })
  const testUser = await prisma.user.upsert({ where: { email: 'user@ratespace.demo' }, update: { name: 'Abhi\'s Rate Space Community', password: userPassword, role: 'USER', address: 'Mumbai, Maharashtra' }, create: { name: 'Abhi\'s Rate Space Community', email: 'user@ratespace.demo', password: userPassword, role: 'USER', address: 'Mumbai, Maharashtra' } })
  const raters = [testUser]
  const additionalRaters = [
    ['rater2@ratespace.demo', 'Priya Community Rating Member', 'Andheri East, Mumbai'],
    ['rater3@ratespace.demo', 'Rohan Community Rating Member', 'Powai, Mumbai'],
    ['rater4@ratespace.demo', 'Meera Community Rating Member', 'Worli, Mumbai'],
    ['rater5@ratespace.demo', 'Kabir Community Rating Member', 'Lower Parel, Mumbai'],
    ['rater6@ratespace.demo', 'Ananya Community Rating Member', 'Bandra East, Mumbai'],
    ['rater7@ratespace.demo', 'Vikram Community Rating Member', 'Chembur, Mumbai'],
    ['rater8@ratespace.demo', 'Sana Community Rating Member', 'Juhu, Mumbai'],
  ] as const
  for (const [email, name, address] of additionalRaters) raters.push(await prisma.user.upsert({ where: { email }, update: { name, password: userPassword, role: 'USER', address }, create: { name, email, password: userPassword, role: 'USER', address } }))

  const storeRecords = []
  for (let index = 0; index < stores.length; index += 1) {
    const [email, name] = ownerData[index]
    const owner = await prisma.user.upsert({ where: { email }, update: { name, password: ownerPassword, role: 'STORE_OWNER', address: stores[index][2] }, create: { name, email, password: ownerPassword, role: 'STORE_OWNER', address: stores[index][2] } })
    const [storeName, storeEmail, address] = stores[index]
    storeRecords.push(await prisma.store.upsert({ where: { ownerId: owner.id }, update: { name: storeName, email: storeEmail, address }, create: { name: storeName, email: storeEmail, address, ownerId: owner.id } }))
  }

  const ratingPlan: Array<[number, number, number, string]> = [
    [0, 0, 5, '2026-08-20T09:15:00.000Z'], [0, 1, 4, '2026-08-21T12:40:00.000Z'], [0, 2, 5, '2026-08-23T07:30:00.000Z'], [0, 3, 3, '2026-08-25T16:10:00.000Z'],
    [0, 4, 4, '2026-08-27T10:05:00.000Z'], [0, 5, 5, '2026-08-28T08:50:00.000Z'], [0, 6, 4, '2026-08-29T14:25:00.000Z'], [0, 7, 5, '2026-08-30T11:45:00.000Z'],
    [1, 0, 4, '2026-08-18T09:00:00.000Z'], [1, 1, 5, '2026-08-22T11:00:00.000Z'], [1, 2, 4, '2026-08-26T15:00:00.000Z'], [2, 0, 3, '2026-08-17T09:00:00.000Z'],
    [2, 1, 4, '2026-08-24T11:00:00.000Z'], [3, 0, 5, '2026-08-16T09:00:00.000Z'], [3, 1, 4, '2026-08-20T11:00:00.000Z'], [3, 2, 5, '2026-08-28T15:00:00.000Z'],
    [4, 0, 4, '2026-08-19T09:00:00.000Z'], [4, 1, 3, '2026-08-25T11:00:00.000Z'], [5, 0, 4, '2026-08-21T09:00:00.000Z'], [5, 2, 5, '2026-08-29T15:00:00.000Z'],
    [6, 1, 3, '2026-08-22T09:00:00.000Z'], [7, 0, 5, '2026-08-23T09:00:00.000Z'], [7, 1, 5, '2026-08-27T15:00:00.000Z'], [8, 2, 4, '2026-08-24T09:00:00.000Z'], [9, 0, 5, '2026-08-30T15:00:00.000Z'],
  ]
  for (const [storeIndex, raterIndex, rating, createdAt] of ratingPlan) {
    const store = storeRecords[storeIndex]
    const rater = raters[raterIndex]
    await prisma.rating.upsert({ where: { userId_storeId: { userId: rater.id, storeId: store.id } }, update: { rating, createdAt: new Date(createdAt) }, create: { userId: rater.id, storeId: store.id, rating, createdAt: new Date(createdAt) } })
  }
  console.log(`Seeded ${storeRecords.length} stores, ${ratingPlan.length} ratings, and demo accounts.`)
  console.log(`Admin: ${admin.email} / ${demoPasswords.admin}`)
  console.log(`User: ${testUser.email} / ${demoPasswords.user}`)
  console.log('Store owner: owner@ratespace.demo / Owner@123!')
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
