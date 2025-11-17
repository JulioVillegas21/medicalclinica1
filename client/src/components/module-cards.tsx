import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface ModuleCard {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export function ModuleCards({ modules }: { modules: ModuleCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((module, index) => (
        <a key={index} href={module.href} data-testid={`card-module-${module.title.toLowerCase()}`}>
          <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all">
            <CardHeader className="space-y-0 pb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mb-4">
                <module.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
