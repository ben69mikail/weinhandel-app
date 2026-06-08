import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const PW = await bcrypt.hash("Test1234!", 10);
  // Admin
  await prisma.user.upsert({
    where: { email: "martin@weinhandel.de" },
    update: {},
    create: {
      email: "martin@weinhandel.de", passwordHash: await bcrypt.hash("Martin2024!", 10),
      firstName: "Martin", lastName: "Volmer", role: "ADMIN",
      employeeType: "PARTTIME", monthlyHours: 160, skills: ["Weinverkauf","Kasse","Events"],
      personnelNumber: "001", isActive: true,
    },
  });

  const employees = [
    { email:"anna@weinhandel.de",    firstName:"Anna",    lastName:"Schmidt",   employeeType:"PARTTIME", hours:80,  skills:["Service","Kasse"],            nr:"002" },
    { email:"thomas@weinhandel.de",  firstName:"Thomas",  lastName:"Müller",    employeeType:"PARTTIME", hours:120, skills:["Weinverkauf","Bar"],           nr:"003" },
    { email:"julia@weinhandel.de",   firstName:"Julia",   lastName:"Weber",     employeeType:"MINIJOB",  hours:40,  skills:["Service","Events"],           nr:"004" },
    { email:"max@weinhandel.de",     firstName:"Max",     lastName:"Becker",    employeeType:"PARTTIME", hours:100, skills:["Küche","Bar","Service"],       nr:"005" },
    { email:"lena@weinhandel.de",    firstName:"Lena",    lastName:"Fischer",   employeeType:"MINIJOB",  hours:40,  skills:["Kasse","Service"],            nr:"006" },
    { email:"peter@weinhandel.de",   firstName:"Peter",   lastName:"Koch",      employeeType:"PARTTIME", hours:80,  skills:["Weinverkauf","Dresscode"],    nr:"007" },
    { email:"sara@weinhandel.de",    firstName:"Sara",    lastName:"Hoffmann",  employeeType:"MINIJOB",  hours:40,  skills:["Service","Events","Kasse"],   nr:"008" },
    { email:"david@weinhandel.de",   firstName:"David",   lastName:"Wagner",    employeeType:"PARTTIME", hours:120, skills:["Bar","Küche"],                nr:"009" },
  ];

  for (const e of employees) {
    await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email, passwordHash: PW,
        firstName: e.firstName, lastName: e.lastName,
        role: "EMPLOYEE",
        employeeType: e.employeeType as any,
        monthlyHours: e.hours,
        skills: e.skills,
        personnelNumber: e.nr,
        isActive: true,
        birthday: new Date(`199${Math.floor(Math.random() * 9)}-${String(Math.floor(Math.random()*12)+1).padStart(2,"0")}-${String(Math.floor(Math.random()*28)+1).padStart(2,"0")}`),
      },
    });
    console.log(`✓ ${e.firstName} ${e.lastName} (${e.email})`);
  }

  // Settings singleton
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id:"singleton", businessName:"Weinhandel Martin Volmer e.K.", defaultShiftStart:"09:00", defaultShiftEnd:"17:00" },
  });

  console.log("\n✅ Seed fertig!");
  console.log("Admin:      martin@weinhandel.de / Martin2024!");
  console.log("Mitarbeiter: alle anderen / Test1234!");
}

main().catch(console.error).finally(() => prisma.$disconnect());