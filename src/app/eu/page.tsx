import { FlaskConical, Globe } from 'lucide-react'

export const metadata = {
  title: 'Peptide Cortex — Not available in your region',
  robots: { index: false, follow: false },
}

export default function EuGeoblockPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="inline-flex items-center justify-center bg-[#1A8A9E]/12 p-3 rounded-2xl mb-6">
          <FlaskConical className="w-8 h-8 text-[#1A8A9E]" />
        </div>

        <h1 className="text-3xl font-bold text-[#1A1915] mb-3">
          Peptide<span className="text-[#1A8A9E]">Cortex</span>
        </h1>

        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-8 text-left mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[#1A8A9E]" />
            <h2 className="text-lg font-semibold text-[#1A1915]">
              Not currently available in your region
            </h2>
          </div>
          <p className="text-[#3A3730] text-sm leading-relaxed mb-3">
            Peptide Cortex is currently available to{' '}
            <span className="font-semibold">US-based users only</span>.
          </p>
          <p className="text-[#B0AAA0] text-sm leading-relaxed">
            We are working on the additional compliance steps (DPA, data
            protection, regional terms of service) required to operate in the
            European Union, the United Kingdom, and Switzerland. Until that
            work is complete, access from those regions is restricted. Thanks
            for your patience.
          </p>
        </div>

        <p className="text-xs text-[#B0AAA0] mt-6">
          Questions: support@tigristechlabs.com
        </p>
      </div>
    </div>
  )
}
