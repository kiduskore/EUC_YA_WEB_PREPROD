with open('templates/dashboard.html', 'r') as f:
    content = f.read()

target = """    </script>
    <script>
        window.USER_PERMISSIONS = {{ user_permissions | tojson | safe }};
    </script>"""

replacement = """    </script>
    <script>
        window.USER_PERMISSIONS = {{ user_permissions | tojson | safe }};
        window.USER_EMAIL = "{{ user_email }}";
        window.USER_ROLE = "{{ user_role }}";
    </script>"""

content = content.replace(target, replacement)

# Add it to the sidebar bottom
sidebar_target = """                <a href="/logout" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </a>
            </nav>
        </aside>"""

sidebar_replacement = """                <a href="/logout" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl mb-4">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </a>
                <div class="mt-auto px-4 py-4 border-t border-slate-800">
                    <div class="text-xs text-slate-400">Signed in as</div>
                    <div class="text-sm font-bold text-white truncate">{{ '{{ userEmail }}' }}</div>
                    <div class="text-xs text-accent uppercase tracking-wider mt-1">{{ '{{ userRole }}' }}</div>
                </div>
            </nav>
        </aside>"""

content = content.replace(sidebar_target, sidebar_replacement)

with open('templates/dashboard.html', 'w') as f:
    f.write(content)
