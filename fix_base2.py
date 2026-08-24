with open('templates/base.html', 'r') as f:
    content = f.read()

target = """            } catch (error) {
                console.error('Error fetching resources:', error);
            }"""

replacement = """            } catch (error) {
                console.error('Error fetching resources:', error);
                const container = document.getElementById('public-resources');
                if (container) {
                    container.innerHTML = '<div class="text-center py-12 text-red-500 col-span-3">Failed to load resources. Please try again later.</div>';
                }
            }"""

content = content.replace(target, replacement)
with open('templates/base.html', 'w') as f:
    f.write(content)
