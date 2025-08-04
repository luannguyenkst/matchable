import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-gradient-to-r from-gray-900 to-blue-900 text-white">
      <!-- Main Footer -->
      <div class="border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Company Info -->
            <div>
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span class="text-white font-bold text-lg">🏅</span>
                </div>
                <div>
                  <span class="text-xl font-bold">Matchable</span>
                  <div class="text-xs text-blue-200 -mt-1">Personal Training</div>
                </div>
              </div>
              <p class="text-gray-300 mb-4">
                Premium personal training sessions for padel, tennis, and fitness with certified professional trainers.
              </p>
              <div class="flex space-x-4">
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.085.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.125-2.6 7.44-6.218 7.44-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.055 0C5.5 0 .104 5.395.104 12.055c0 5.31 3.431 9.818 8.196 11.414-.113-.998-.215-2.53.045-3.617.233-.978 1.505-6.38 1.505-6.38s-.384-.768-.384-1.902c0-1.782 1.034-3.114 2.322-3.114 1.095 0 1.623.821 1.623 1.806 0 1.099-.699 2.743-1.061 4.267-.302 1.276.641 2.317 1.901 2.317 2.281 0 4.034-2.406 4.034-5.878 0-3.066-2.201-5.205-5.347-5.205-3.644 0-5.784 2.738-5.784 5.565 0 1.104.425 2.288.954 2.931.105.127.121.238.09.369-.098.398-.314 1.283-.357 1.462-.057.241-.184.291-.425.176-1.595-.743-2.593-3.077-2.593-4.966 0-4.043 2.942-7.758 8.496-7.758 4.455 0 7.91 3.178 7.91 7.416 0 4.424-2.786 7.981-6.655 7.981-1.301 0-2.527-.677-2.942-1.477l-.802 3.05c-.289 1.117-1.073 2.517-1.598 3.368C9.574 23.812 10.804 24.055 12.055 24.055c6.555 0 11.951-5.395 11.951-11.951C24.006 5.395 18.61.104 12.055.104z"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Training Sessions -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Training Sessions</h3>
              <ul class="space-y-2">
                <li><span class="text-gray-300">🏓 Padel Training</span></li>
                <li><span class="text-gray-300">🎾 Tennis Coaching</span></li>
                <li><span class="text-gray-300">💪 Personal Fitness</span></li>
                <li><span class="text-gray-300">⚡ All Skill Levels</span></li>
                <li><span class="text-gray-300">🏆 Certified Trainers</span></li>
              </ul>
            </div>

            <!-- Support -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Support</h3>
              <ul class="space-y-2">
                <li><a href="mailto:support@matchable.com" class="text-gray-300 hover:text-white transition-colors">Email Support</a></li>
                <li><a href="tel:+1-555-123-4567" class="text-gray-300 hover:text-white transition-colors">Phone Support</a></li>
                <li><span class="text-gray-300">Booking Help</span></li>
                <li><span class="text-gray-300">Session Changes</span></li>
                <li><span class="text-gray-300">Cancellations</span></li>
              </ul>
            </div>

            <!-- Legal -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Legal</h3>
              <ul class="space-y-2">
                <li><a routerLink="/privacy" class="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a routerLink="/terms" class="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
              
              <div class="mt-6">
                <h4 class="text-sm font-semibold mb-2">Contact Info</h4>
                <div class="text-gray-300 text-sm space-y-1">
                  <p>📧 support&#64;matchable.com</p>
                  <p>📞 (555) 123-4567</p>
                  <p>📍 123 Training Center, City, ST 12345</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Newsletter Signup -->
      <div class="border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="max-w-2xl mx-auto text-center">
            <h3 class="text-xl font-semibold mb-2">Stay Updated</h3>
            <p class="text-gray-300 mb-6">Subscribe to get notified about new trainers and special training programs.</p>
            <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                class="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              >
              <button class="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row items-center justify-between">
          <p class="text-gray-300 text-sm">
            © {{ currentYear }} Matchable Personal Training. All rights reserved.
          </p>
          
          <!-- Payment Methods -->
          <div class="flex items-center space-x-4 mt-4 md:mt-0">
            <span class="text-gray-400 text-sm">We Accept:</span>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-5 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                <span class="text-xs text-gray-400">VISA</span>
              </div>
              <div class="w-8 h-5 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                <span class="text-xs text-gray-400">MC</span>
              </div>
              <div class="w-8 h-5 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                <span class="text-xs text-gray-400">AMEX</span>
              </div>
              <div class="w-8 h-5 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                <span class="text-xs text-gray-400">PP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}