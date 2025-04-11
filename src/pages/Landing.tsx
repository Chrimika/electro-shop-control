
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BarChart3, Smartphone, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="bg-white py-4 border-b">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">ElectroShopControl</div>
          <nav className="space-x-4 hidden md:block">
            <Link to="/features" className="text-gray-600 hover:text-blue-600">Fonctionnalités</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-blue-600">Tarifs</Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600">À propos</Link>
            <Link to="/login">
              <Button variant="outline" className="ml-4">Connexion</Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <span className="sr-only">Menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Gérez vos boutiques électroniques en toute sécurité</h1>
              <p className="text-xl mb-8">Une solution complète pour les propriétaires de boutiques d'électronique - gérez vos ventes, stocks, réparations et équipes en un seul endroit.</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Voir la démo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-lg shadow-xl p-2 transform rotate-1">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Dashboard Preview" 
                  className="rounded w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités puissantes pour votre entreprise</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sécurité maximale</h3>
              <p className="text-gray-600">Protection complète de vos données commerciales et informations clients sensibles.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Statistiques détaillées</h3>
              <p className="text-gray-600">Suivez les performances de chaque boutique avec des analyses en temps réel.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestion des réparations</h3>
              <p className="text-gray-600">Système complet pour le suivi des réparations de téléphones et ordinateurs.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Notifications en temps réel</h3>
              <p className="text-gray-600">Restez informé des ventes, stocks bas et échéances de paiement.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-boutiques</h3>
              <p className="text-gray-600">Gérez toutes vos boutiques depuis une seule interface centralisée.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestion des ventes</h3>
              <p className="text-gray-600">Multiples types de ventes adaptées à votre activité et vos clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <svg className="w-12 h-12 text-white/30 mx-auto mb-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M464 32H336c-26.5 0-48 21.5-48 48v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48zm-288 0H48C21.5 32 0 53.5 0 80v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48z"></path>
            </svg>
            <p className="text-xl md:text-2xl mb-8 italic">ElectroShopControl a transformé notre façon de gérer nos 5 boutiques. Notre chiffre d'affaires a augmenté de 30% et nos clients sont plus satisfaits que jamais grâce au suivi efficace des réparations.</p>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Client" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h4 className="font-bold">Jean Dupont</h4>
                <p className="text-blue-200">Directeur, TechStore France</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à transformer votre gestion de boutiques?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de propriétaires qui ont déjà simplifié et sécurisé la gestion de leurs boutiques d'électronique.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 text-white px-8 py-3">
              Commencer gratuitement
            </Button>
          </Link>
          <p className="mt-4 text-gray-500">Essai gratuit de 14 jours, aucune carte de crédit requise</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">ElectroShopControl</h3>
              <p className="mb-4">La solution complète pour gérer vos boutiques d'électronique en toute sécurité.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Tarifs</Link></li>
                <li><Link to="/security" className="hover:text-white">Sécurité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-white">Centre d'aide</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/documentation" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Légal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-white">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-white">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 ElectroShopControl. Tous droits réservés.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
