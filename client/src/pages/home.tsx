import * as React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
  const [, navigate] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Territory Assignment Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assign Territories</CardTitle>
                <CardDescription>
                  Assign counties or ZIP codes to sales representatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create new territory assignments for sales representatives by selecting counties
                  or specifying ZIP code ranges.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate("/assign")}>Go to Assign</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reassign Territories</CardTitle>
                <CardDescription>
                  Transfer territories between sales representatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Move territories from one sales representative to another, either by county
                  or by specific ZIP code ranges.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate("/reassign")}>Go to Reassign</Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No recent activity to display
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
