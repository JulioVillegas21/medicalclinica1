import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export interface Task {
  id: string;
  title: string;
  description: string;
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allCompleted = tasks.length > 0 && completedTasks.size === tasks.length;

  const handleToggleTask = (taskId: string) => {
    if (confirmed) return;

    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (allCompleted) {
      setConfirmed(true);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Tareas Pendientes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {confirmed 
                  ? "Todas las tareas completadas ✓" 
                  : `${completedTasks.size} de ${tasks.length} completadas`}
              </p>
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!allCompleted || confirmed}
              className={`${
                allCompleted && !confirmed
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  : ""
              }`}
              variant={confirmed ? "outline" : "default"}
            >
              {confirmed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmado
                </>
              ) : (
                "Confirmar Tareas"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.has(task.id);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    } ${confirmed ? "opacity-75" : ""}`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      disabled={confirmed}
                      className={`${
                        isCompleted
                          ? "border-emerald-600 data-[state=checked]:bg-emerald-600"
                          : ""
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="text-left w-full"
                      >
                        <p
                          className={`text-sm font-semibold transition-all ${
                            isCompleted
                              ? "text-emerald-700 line-through"
                              : "text-gray-900 hover:text-blue-600"
                          }`}
                        >
                          {task.title}
                        </p>
                      </button>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription className="pt-4">
              {selectedTask?.description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
