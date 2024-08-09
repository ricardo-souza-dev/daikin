# coding: utf-8

def write_manifest(base,dir="")
	files = Dir::entries(base+"/"+dir)
	exts = ['.html','.rb','.js','.json','.css','.png','.jpg','.gif','.ttf','.otf']
	File.open('svm.manifest','a') do |io|
		files.each do |f|
			next if(f == "." || f == "..")
			next if(File.directory?(base+"/"+dir+"/"+f))
			ext = File.extname(f)
			next if(exts.include?(ext) == false)
			path = dir+'/'+f
			path = f if(dir == '')
			io.puts(path)
		end
	end
end

# make manufest file

File.open('svm.manifest','w') do |io|
	io.puts('CACHE MANIFEST')
	io.puts('# Ver4.0 C1')
	io.puts('CACHE:')
end

folder = ARGV[0]
folder = "." if(folder == nil)

# html files
write_manifest(folder)

# css files
write_manifest(folder,"css")

# font files
write_manifest(folder,"font")

# icon files
write_manifest(folder,"icon")
#write_manifest(folder,"icon/on")

# image files
write_manifest(folder,"image")

write_manifest(folder,"jqm")
# jquery files
write_manifest(folder,"jquery")

# script files
write_manifest(folder,"script")

File.open('svm.manifest','a') do |io|
	io.puts('NETWORK:')
	io.puts('*')
end
