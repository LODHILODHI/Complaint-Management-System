import {
  ApprovalStatus,
  ComplaintStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
  phone?: string;
  address?: string;
  cnic?: string;
  city?: string;
  district?: string;
  province?: string;
  gender?: string;
  occupation?: string;
  departmentNames?: string[];
  homeDepartmentName?: string;
}) {
  const password = await bcrypt.hash(input.password, 10);
  const departments = input.departmentNames?.length
    ? await prisma.department.findMany({
        where: { name: { in: input.departmentNames } },
      })
    : [];

  const homeDepartment = input.homeDepartmentName
    ? await prisma.department.findUnique({
        where: { name: input.homeDepartmentName },
      })
    : null;

  const profileFields = {
    phone: input.phone,
    address: input.address,
    cnic: input.cnic,
    city: input.city,
    district: input.district,
    province: input.province,
    gender: input.gender,
    occupation: input.occupation,
    profileCompleted: true,
  };

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password,
      role: input.role,
      ...profileFields,
      ...(input.role === Role.USER
        ? { homeDepartmentId: homeDepartment?.id ?? null }
        : { homeDepartmentId: null }),
      approvalStatus: ApprovalStatus.APPROVED,
      ...(input.role === Role.DEPARTMENT_HEAD
        ? {
            managedDepartments: {
              set: departments.map((d) => ({ id: d.id })),
            },
          }
        : { managedDepartments: { set: [] } }),
    },
    create: {
      email: input.email,
      name: input.name,
      password,
      role: input.role,
      ...profileFields,
      approvalStatus: ApprovalStatus.APPROVED,
      ...(input.role === Role.USER
        ? { homeDepartmentId: homeDepartment?.id ?? null }
        : {}),
      ...(input.role === Role.DEPARTMENT_HEAD
        ? {
            managedDepartments: {
              connect: departments.map((d) => ({ id: d.id })),
            },
          }
        : {}),
    },
  });
}

async function main() {
  console.log("Seeding demo data...");

  const sharedPassword = "Pass@12345";
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cms.local";
  const adminPassword = sharedPassword;
  const adminName = process.env.ADMIN_NAME ?? "System Admin";

  const departmentNames = [
    "Public Works",
    "Water & Sanitation",
    "Agriculture Extension",
    "Food Safety",
  ];

  const departments = [];
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    departments.push(dept);
  }

  const [publicWorks, water, agri, food] = departments;

  const admin = await upsertUser({
    email: adminEmail,
    name: adminName,
    password: adminPassword,
    role: Role.ADMIN,
    phone: "+92-300-1110001",
  });

  const admin2 = await upsertUser({
    email: "admin2@cms.local",
    name: "Fatima Raza",
    password: sharedPassword,
    role: Role.ADMIN,
    phone: "+92-300-1110002",
  });

  const hodWorks = await upsertUser({
    email: "hod.works@cms.local",
    name: "Imran Malik",
    password: sharedPassword,
    role: Role.DEPARTMENT_HEAD,
    phone: "+92-321-2221001",
    departmentNames: ["Public Works", "Water & Sanitation"],
  });

  const hodAgri = await upsertUser({
    email: "hod.agri@cms.local",
    name: "Sana Qureshi",
    password: sharedPassword,
    role: Role.DEPARTMENT_HEAD,
    phone: "+92-321-2221002",
    departmentNames: ["Agriculture Extension", "Food Safety"],
  });

  const citizen1 = await upsertUser({
    email: "ahmed.khan@example.com",
    name: "Ahmed Khan",
    password: sharedPassword,
    role: Role.USER,
    phone: "+92-300-5551234",
    address: "North Block A, Islamabad",
    cnic: "61101-1234567-1",
    city: "Islamabad",
    district: "Islamabad",
    province: "Islamabad Capital Territory",
    gender: "Male",
    occupation: "Shopkeeper",
    homeDepartmentName: "Public Works",
  });

  const citizen2 = await upsertUser({
    email: "aisha.bibi@example.com",
    name: "Aisha Bibi",
    password: sharedPassword,
    role: Role.USER,
    phone: "+92-333-7778899",
    address: "Green Town, Lahore",
    cnic: "35202-7654321-2",
    city: "Lahore",
    district: "Lahore",
    province: "Punjab",
    gender: "Female",
    occupation: "Teacher",
    homeDepartmentName: "Water & Sanitation",
  });

  const citizen3 = await upsertUser({
    email: "bilal.hussain@example.com",
    name: "Bilal Hussain",
    password: sharedPassword,
    role: Role.USER,
    phone: "+92-345-1122334",
    address: "Canal Road, Faisalabad",
    cnic: "33100-9988776-3",
    city: "Faisalabad",
    district: "Faisalabad",
    province: "Punjab",
    gender: "Male",
    occupation: "Farmer",
    homeDepartmentName: "Agriculture Extension",
  });

  // Fresh demo complaints each seed run
  await prisma.complaintComment.deleteMany();
  await prisma.complaintAttachment.deleteMany();
  await prisma.complaint.deleteMany();

  const openComplaint = await prisma.complaint.create({
    data: {
      title: "Broken streetlight on Main Road",
      description:
        "Streetlight near F01-1-001 has been out for a week. Area is unsafe after dark.",
      status: ComplaintStatus.OPEN,
      userId: citizen1.id,
      departmentId: publicWorks.id,
    },
  });

  const inProgress = await prisma.complaint.create({
    data: {
      title: "Uneven water supply in Block C",
      description:
        "Water pressure drops every evening. Residents need inspection of the main line.",
      status: ComplaintStatus.IN_PROGRESS,
      userId: citizen2.id,
      departmentId: water.id,
      assignedDeptHeadId: hodWorks.id,
      comments: {
        create: [
          {
            commentedBy: admin.id,
            comment: "Please inspect the Block C feeder line this week.",
            isFinalResolution: false,
          },
          {
            commentedBy: hodWorks.id,
            comment: "Team scheduled for site visit tomorrow morning.",
            isFinalResolution: false,
          },
        ],
      },
    },
  });

  const resolved = await prisma.complaint.create({
    data: {
      title: "Pest spray request for olive nursery",
      description:
        "Nursery plants show pest damage. Requesting official spray schedule.",
      status: ComplaintStatus.RESOLVED,
      userId: citizen3.id,
      departmentId: agri.id,
      assignedDeptHeadId: hodAgri.id,
      comments: {
        create: [
          {
            commentedBy: admin.id,
            comment: "Forwarded to Agriculture Extension for field action.",
            isFinalResolution: false,
          },
          {
            commentedBy: hodAgri.id,
            comment: "Spray completed on schedule. Nursery cleared.",
            isFinalResolution: true,
          },
        ],
      },
    },
  });

  const openFood = await prisma.complaint.create({
    data: {
      title: "Expired packaged food at local market",
      description:
        "Vendor selling packaged items past expiry. Need food safety inspection.",
      status: ComplaintStatus.OPEN,
      userId: citizen1.id,
      departmentId: food.id,
    },
  });

  console.log("\nSeed complete.\n");
  console.log("Login credentials (all passwords = Pass@12345 unless ADMIN_PASSWORD set):");
  console.log("--------------------------------------------------");
  console.log(`Admin     : ${admin.email} / ${adminPassword}`);
  console.log(`Admin 2   : ${admin2.email} / ${sharedPassword}`);
  console.log(`HOD Works : ${hodWorks.email} / ${sharedPassword}`);
  console.log(`HOD Agri  : ${hodAgri.email} / ${sharedPassword}`);
  console.log(`User 1    : ${citizen1.email} / ${sharedPassword}`);
  console.log(`User 2    : ${citizen2.email} / ${sharedPassword}`);
  console.log(`User 3    : ${citizen3.email} / ${sharedPassword}`);
  console.log("--------------------------------------------------");
  console.log(
    `Departments: ${departments.map((d) => d.name).join(", ")}`,
  );
  console.log(
    `Complaints : OPEN=${openComplaint.id.slice(0, 8)}…, IN_PROGRESS=${inProgress.id.slice(0, 8)}…, RESOLVED=${resolved.id.slice(0, 8)}…, OPEN(food)=${openFood.id.slice(0, 8)}…`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
