import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema } from '@/lib/utils'
import PobViewerClient from './PobViewerClient'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params
  const isPt = locale === 'pt-br'
  const canonical = buildCanonical('/tools/pob-viewer', locale)

  const title = isPt
    ? 'Visualizador de Build PoE — Importar Path of Building | Path of Trade'
    : 'PoE Build Viewer — Import Path of Building | Path of Trade'
  const description = isPt
    ? 'Cole seu código Path of Building para visualizar sua build de PoE: stats, equipamentos, gems e destaques da árvore passiva.'
    : 'Paste your Path of Building code to visualize your PoE build: stats, equipment, gems and passive tree highlights.'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: buildAbsoluteUrl('/tools/pob-viewer'),
        'pt-BR': buildAbsoluteUrl('/pt-br/tools/pob-viewer'),
        'x-default': buildAbsoluteUrl('/tools/pob-viewer'),
      },
    },
    openGraph: { title, description, url: canonical, type: 'website', siteName: 'Path of Trade' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PobViewerPage(props: PageProps) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const isPt = locale === 'pt-br'

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: isPt ? 'Ferramentas' : 'Tools', url: '/tools' },
    { name: isPt ? 'Visualizador de Build' : 'PoB Viewer', url: '/tools/pob-viewer' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container mx-auto px-4 py-8">
        <PobViewerClient locale={locale} />
      </div>
    </>
  )
}
