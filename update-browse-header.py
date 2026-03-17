import re

with open('components/browse/BrowseHeader.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useHoverDropdown } from '@/hooks/useHoverDropdown';")

content = content.replace("const [isDropdownOpen, setIsDropdownOpen] = useState(false);", "const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();")

content = re.sub(
    r'<div\s+className="flex items-center space-x-3 hidden md:flex"\s+onMouseEnter=\{\(\) => setIsDropdownOpen\(true\)\}\s+onMouseLeave=\{\(\) => setIsDropdownOpen\(false\)\}\s*>',
    '<div className="flex items-center space-x-3 hidden md:flex">',
    content
)

content = content.replace("<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>", "<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>")

content = content.replace(
    '<Button variant="ghost" className="p-0 h-auto hover:bg-transparent flex items-center gap-2">',
    '<Button variant="ghost" className="p-0 h-auto hover:bg-transparent flex items-center gap-2" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>'
)

content = content.replace(
    '<DropdownMenuContent align="end" className="w-56">',
    '<DropdownMenuContent align="end" className="w-56" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>'
)

with open('components/browse/BrowseHeader.tsx', 'w') as f:
    f.write(content)
