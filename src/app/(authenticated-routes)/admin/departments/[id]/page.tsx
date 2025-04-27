import { notFound } from 'next/navigation';
import { department_status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, GraduationCap, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: department_status;
  adminId: number | null;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count: {
    programs: number;
    faculty: number;
    students: number;
  };
}

interface Program {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  _count: {
    students: number;
    courses: number;
  };
}

interface DepartmentAdmin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  isHead: boolean;
}

export default async function DepartmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const departmentId = parseInt(params.id);
    if (isNaN(departmentId)) {
      notFound();
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        _count: {
          select: {
            programs: true,
            faculty: true,
            students: true,
          },
        },
      },
    });

    if (!department) {
      notFound();
    }

    // Fetch programs
    const programs = await prisma.program.findMany({
      where: { departmentId },
      include: {
        _count: {
          select: {
            students: true,
            courses: true,
          },
        },
      },
    });

    // Fetch department admins
    const admins = await prisma.user.findMany({
      where: {
        userrole: {
          some: {
            role: {
              name: 'department_admin',
            },
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    const formattedAdmins: DepartmentAdmin[] = admins.map((admin) => ({
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      isHead: admin.id === department.adminId,
    }));

    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <Link href='/admin/departments'>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
            </Link>
            <h1 className='text-3xl font-bold'>{department.name}</h1>
            <Badge
              variant={department.status === 'active' ? 'default' : 'secondary'}
            >
              {department.status}
            </Badge>
          </div>
          <div className='flex gap-2'>
            <Link href={`/admin/departments/${department.id}/edit`}>
              <Button>Edit Department</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='programs'>Programs</TabsTrigger>
            <TabsTrigger value='admins'>Department Admins</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Programs
                  </CardTitle>
                  <BookOpen className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {department._count.programs}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Faculty
                  </CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {department._count.faculty}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Students
                  </CardTitle>
                  <GraduationCap className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {department._count.students}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Department Code
                    </p>
                    <p className='font-medium'>{department.code}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Status</p>
                    <p className='font-medium capitalize'>
                      {department.status}
                    </p>
                  </div>
                  <div className='col-span-2'>
                    <p className='text-sm text-muted-foreground'>Description</p>
                    <p className='font-medium'>
                      {department.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='programs'>
            <Card>
              <CardHeader>
                <CardTitle>Programs Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Courses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className='font-medium'>
                          {program.name}
                        </TableCell>
                        <TableCell>{program.code}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              program.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {program.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{program._count.students}</TableCell>
                        <TableCell>{program._count.courses}</TableCell>
                      </TableRow>
                    ))}
                    {programs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='text-center py-8 text-muted-foreground'
                        >
                          No programs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='admins'>
            <Card>
              <CardHeader>
                <CardTitle>Department Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className='font-medium'>
                          {admin.first_name} {admin.last_name}
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={admin.isHead ? 'default' : 'secondary'}
                          >
                            {admin.isHead
                              ? 'Head of Department'
                              : 'Department Admin'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {formattedAdmins.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='text-center py-8 text-muted-foreground'
                        >
                          No department admins found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error fetching department details:', error);
    notFound();
  }
}
