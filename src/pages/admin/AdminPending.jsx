// A module whose phase has not landed yet. It says so instead of rendering an
// empty screen: a menu entry that cannot do anything is still a promise.
import { PageHeader, NotInstrumented } from '../../components/admin/adminUi.jsx';

export default function AdminPending({ title, phase, lead }) {
  return (
    <>
      <PageHeader title={title} lead={lead} />
      <NotInstrumented
        label={title}
        reason={`Dieses Modul gehört zu ${phase} des Admin-Panels (docs/admin-panel.md) und ist noch nicht gebaut.`}
        unblock={`${phase} umsetzen — Endpunkt und Bildschirm nach der Spezifikation.`}
      />
    </>
  );
}
