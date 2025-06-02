'use client';

import { CLOPLOMappingList } from '@/components/clo-plo-mapping/CLOPLOMappingList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CLOPLOMappingsPage() {
  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>CLO-PLO Mappings</h1>
          <p className='text-muted-foreground'>
            Manage mappings between Course Learning Outcomes (CLO) and Program
            Learning Outcomes (PLO)
          </p>
        </div>
      </div>

      <Tabs defaultValue='mappings' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='mappings'>Mappings</TabsTrigger>
          <TabsTrigger value='status'>Mapping Status</TabsTrigger>
        </TabsList>

        <TabsContent value='mappings'>
          <Card>
            <CardHeader>
              <CardTitle>CLO-PLO Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <CLOPLOMappingList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='status'>
          <Card>
            <CardHeader>
              <CardTitle>Mapping Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Mappings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>0</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Active Mappings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>0</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Pending Mappings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>0</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
