import { getPayments } from '@/lib/actions/payments'
import PaymentsClient from '@/components/pagos/payments-client'

export default async function PagosPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams
  const payments = await getPayments()

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500">{payments.filter(p => !p.paid).length} pendientes</p>
        </div>
      </div>
      <PaymentsClient initialPayments={payments} autoOpen={sp?.new === '1'} />
    </div>
  )
}
