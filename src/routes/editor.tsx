import { createFileRoute } from '@tanstack/react-router'
import { EditorWorkspace } from '@/components/editor/editor-workspace'

export const Route = createFileRoute('/editor')({
  validateSearch: (search: Record<string, unknown>) => ({
    m: typeof search.m === 'string' ? search.m : undefined,
  }),
  component: EditorPage,
})

function EditorPage() {
  const { m } = Route.useSearch()
  return <EditorWorkspace mediaId={m} />
}
