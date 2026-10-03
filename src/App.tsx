import { useState } from 'react'
import { Auth, Welcome } from './screens/Auth'
import ClientApp from './screens/Client'
import ProviderApp from './screens/Provider'
import { useSession, type Role } from './lib/store'

export default function App() {
  const me = useSession()
  const [role, setRole] = useState<Role | null>(null)
  return (
    <div className="mx-auto h-dvh max-w-[430px] relative overflow-hidden bg-white md:shadow-[0_0_80px_rgba(11,31,68,.3)]">
      {me ? (me.role === 'pro' ? <ProviderApp me={me} /> : <ClientApp me={me} />) : role ? <Auth role={role} back={() => setRole(null)} /> : <Welcome pick={setRole} />}
    </div>
  )
}
