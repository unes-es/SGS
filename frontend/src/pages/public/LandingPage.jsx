import Navbar       from './sections/Navbar'
import Hero         from './sections/Hero'
import Centres      from './sections/Centres'
import Filieres     from './sections/Filieres'
import Chiffres     from './sections/Chiffres'
import Preinscription from './sections/Preinscription'
import Temoignages  from './sections/Temoignages'
import Actualites   from './sections/Actualites'
import Evenements   from './sections/Evenements'
import Localisation from './sections/Localisation'
import FAQ          from './sections/FAQ'
import Contact      from './sections/Contact'
import Footer       from './sections/Footer'
import StickyButtons from './sections/StickyButtons'

export default function LandingPage() {
  return (
    <div className="font-sans antialiased text-gray-900 bg-white">
      <Navbar />
      <Hero />
      <Centres />
      <Filieres />
      <Chiffres />
      <Preinscription />
      <Temoignages />
      <Actualites />
      <Evenements />
      <Localisation />
      <FAQ />
      <Contact />
      <Footer />
      <StickyButtons />
    </div>
  )
}