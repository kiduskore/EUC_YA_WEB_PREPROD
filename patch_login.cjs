const fs = require('fs');
let content = fs.readFileSync('views/login.ejs', 'utf-8');

content = content.replace(/bg-\[#0b1437\]/g, 'bg-zinc-50 dark:bg-studio-950');
content = content.replace(/text-white/g, 'text-studio-900 dark:text-white');
content = content.replace(/style="background: #111c44; border: 1px solid rgba\(255, 255, 255, 0.05\); border-radius: 1.25rem; box-shadow: 0 4px 24px rgba\(0,0,0,0.2\);"/g, 'class="bg-white dark:bg-studio-900 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-xl"');

content = content.replace(/bg-gradient-to-tr from-\[#0075ff\] to-\[#01b574\]/g, 'bg-studio-900 dark:bg-white text-white dark:text-studio-900');
content = content.replace(/text-white/g, ''); // Handled above roughly, but I'll do a better replace:

// Let's just rewrite the whole login page structure so it is perfectly clean
const newLogin = `<%- include('partials/header') %>
<div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-50 dark:bg-studio-950 pt-24 pb-12">
    <!-- Ambient Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]"></div>
    </div>
    
    <div class="w-full max-w-md p-8 sm:p-10 relative z-10 text-center bg-white dark:bg-studio-900 border border-zinc-200/80 dark:border-white/10 rounded-[2rem] shadow-2xl">
        <div class="flex justify-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-studio-900 dark:bg-white text-white dark:text-studio-900 flex items-center justify-center shadow-lg">
                <span class="text-2xl font-black tracking-tight">E</span>
            </div>
        </div>
        
        <h2 class="text-2xl font-bold mb-3 tracking-tight text-studio-900 dark:text-white"><%= typeof t !== 'undefined' ? t('auth.welcomeBack') : 'Welcome Back' %></h2>
        <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-8"><%= typeof t !== 'undefined' ? t('auth.signInDashboard') : 'Sign in to the Leader Dashboard' %></p>
        
        <% if (typeof error !== 'undefined' && error) { %>
        <div class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm mb-6 text-left">
            <%= error %>
        </div>
        <% } %>
        <% if (typeof success !== 'undefined' && success) { %>
        <div class="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 text-sm mb-6 text-left">
            <%= success %>
        </div>
        <% } %>
        
        <form method="POST" action="/login" class="space-y-5 text-left">
            <div>
                <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 tracking-wide uppercase"><%= typeof t !== 'undefined' ? t('auth.email') : 'Email Address' %></label>
                <input type="email" name="email" autocapitalize="none" autocorrect="off" autocomplete="email" placeholder="leader@euc.org" required class="w-full bg-zinc-50 dark:bg-studio-800 border border-zinc-200 dark:border-white/10 text-studio-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium">
            </div>
            <div>
                <div class="flex justify-between items-center mb-1.5">
                    <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase"><%= typeof t !== 'undefined' ? t('auth.password') : 'Password' %></label>
                    <a href="/forgot-password" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"><%= typeof t !== 'undefined' ? t('auth.forgotPassword') : 'Forgot password?' %></a>
                </div>
                <input type="password" name="password" autocomplete="current-password" placeholder="••••••••" required class="w-full bg-zinc-50 dark:bg-studio-800 border border-zinc-200 dark:border-white/10 text-studio-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium">
            </div>
            
            <button type="submit" class="w-full bg-studio-900 dark:bg-white text-white dark:text-studio-900 font-bold rounded-xl p-4 mt-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg">
                <%= typeof t !== 'undefined' ? t('auth.signIn') : 'Sign In' %>
            </button>
        </form>
        
        <div class="mt-8 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5 pt-6">
            <%= typeof t !== 'undefined' ? t('auth.haveSignupCode') : 'Have a signup code?' %> <a href="/claim-account" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-bold"><%= typeof t !== 'undefined' ? t('auth.claimAccount') : 'Claim account' %></a>
        </div>
        
        <div class="mt-6">
            <a href="/" class="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5">
                <span>←</span> <%= typeof t !== 'undefined' ? t('common.backToPublic') : 'Back to Website' %>
            </a>
        </div>
    </div>
</div>
<%- include('partials/footer') %>
`;

fs.writeFileSync('views/login.ejs', newLogin);
