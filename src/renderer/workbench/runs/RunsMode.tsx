import { useWorkbenchStore } from '../store';
import RunDetail from './RunDetail';
import RunList from './RunList';

export default function RunsMode() {
  const { runs, selectedRunId, selectRun } = useWorkbenchStore();
  return <section className="workbench-mode workbench-mode--runs" aria-label="Runs mode"><header className="workbench-mode__heading"><div><p>Mock history</p><h1>Inspect the path, not a black box</h1></div><span>Local sample data only</span></header><div className="runs-layout"><RunList runs={runs} selectedRunId={selectedRunId} onSelect={selectRun} /><RunDetail run={runs.find((run) => run.id === selectedRunId)} /></div></section>;
}
