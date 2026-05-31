import { getTasksByStatus } from '@/lib/actions/tasks'
import KanbanBoard from '@/components/tareas/kanban-board'
import NewTaskModal from '@/components/tareas/new-task-modal'

export default async function TareasPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams
  const tasksByStatus = await getTasksByStatus()
  const total = Object.values(tasksByStatus).flat().length

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500">{total} tareas</p>
        </div>
        <NewTaskModal autoOpen={sp?.new === '1'} />
      </div>
      <KanbanBoard initialTasks={tasksByStatus} />
    </div>
  )
}
