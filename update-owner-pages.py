import glob
import re

files = [
    'app/owner/dashboard/page.tsx',
    'app/owner/bookings/page.tsx',
    'app/owner/profile/page.tsx',
    'app/owner/analytics/page.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Add import
    if "useHoverDropdown" not in content:
        content = content.replace(
            "import { useAuth } from '@/contexts/AuthContext';",
            "import { useAuth } from '@/contexts/AuthContext';\nimport { useHoverDropdown } from '@/hooks/useHoverDropdown';"
        )
    
    # Add hook inside component
    # Need to find the component function component start. 
    # Usually `function OwnerDashboard() {` or `export default function Analytics() {`
    
    funcs = re.findall(r'(function\s+\w+\(\)\s*\{)', content)
    for func in funcs:
        # Avoid doing this for helper functions
        if 'Dashboard' in func or 'Profile' in func or 'Analytics' in func or 'BookingsList' in func:
            if "useHoverDropdown()" not in content:
                content = content.replace(
                    func,
                    func + "\n  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();"
                )
    
    # Replace DropdownMenu
    content = content.replace('<DropdownMenu>', '<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>')
    
    # Replace Button
    button_match = re.search(r'<Button\s+variant="ghost"\s+className="h-auto p-1\.5 hover:bg-gray-50 rounded-xl flex items-center gap-3"\s*>', content)
    if button_match:
        content = content.replace(
            button_match.group(0),
            '<Button\n                  variant="ghost"\n                  className="h-auto p-1.5 hover:bg-gray-50 rounded-xl flex items-center gap-3"\n                  onMouseEnter={handleMouseEnter}\n                  onMouseLeave={handleMouseLeave}\n                >'
        )

    # Replace DropdownMenuContent
    content_match = re.search(r'<DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-1">', content)
    if content_match:
         content = content.replace(
            content_match.group(0),
            '<DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>'
        )

    content_match2 = re.search(r'<DropdownMenuContent align="end" className="(w-56|w-64) rounded-xl shadow-xl border-gray-100 p-1">', content)
    if content_match2:
         content = content.replace(
            content_match2.group(0),
            f'<DropdownMenuContent align="end" className="{content_match2.group(1)} rounded-xl shadow-xl border-gray-100 p-1" onMouseEnter={{handleMouseEnter}} onMouseLeave={{handleMouseLeave}}>'
        )

    with open(file, 'w') as f:
        f.write(content)
