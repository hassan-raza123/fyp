import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserCheck, UserX, FileUp } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  return (
    <div className='space-y-6'>
      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Total Users</p>
              <p className='text-2xl font-bold'>1,234</p>
            </div>
            <Users className='h-8 w-8 text-blue-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Active Users</p>
              <p className='text-2xl font-bold'>1,100</p>
            </div>
            <UserCheck className='h-8 w-8 text-green-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Pending Approval
              </p>
              <p className='text-2xl font-bold'>34</p>
            </div>
            <UserX className='h-8 w-8 text-yellow-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                New This Month
              </p>
              <p className='text-2xl font-bold'>56</p>
            </div>
            <Plus className='h-8 w-8 text-purple-500' />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='flex flex-wrap gap-4'>
        <Link href='/dashboard/users/create'>
          <Button className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Add New User
          </Button>
        </Link>
        <Link href='/dashboard/users/import'>
          <Button variant='outline' className='flex items-center gap-2'>
            <FileUp className='h-4 w-4' />
            Bulk Import
          </Button>
        </Link>
      </div>

      {/* Recent Users Table */}
      <Card className='p-4'>
        <h2 className='text-lg font-semibold mb-4'>Recent Users</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Last Active
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {/* Sample data - will be replaced with actual data */}
              <tr>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                      <span className='text-gray-500'>JD</span>
                    </div>
                    <div className='ml-4'>
                      <div className='text-sm font-medium text-gray-900'>
                        John Doe
                      </div>
                      <div className='text-sm text-gray-500'>
                        john.doe@example.com
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                    Teacher
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                    Active
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  2 hours ago
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  <button className='text-blue-600 hover:text-blue-900 mr-3'>
                    Edit
                  </button>
                  <button className='text-red-600 hover:text-red-900'>
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
