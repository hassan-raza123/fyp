"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentManagement } from "./StudentManagement"

export function UserModule() {
  const [activeTab, setActiveTab] = useState("students")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="administrators">Administrators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <StudentManagement />
        </TabsContent>
        
        <TabsContent value="teachers">
          <div className="p-4">
            <h2 className="text-xl font-semibold">Teacher Management</h2>
            <p className="text-muted-foreground">Teacher management functionality coming soon...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="administrators">
          <div className="p-4">
            <h2 className="text-xl font-semibold">Administrator Management</h2>
            <p className="text-muted-foreground">Administrator management functionality coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 