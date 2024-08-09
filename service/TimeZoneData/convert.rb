File.open('TimeZone.list') do |io|
	while(line = io.gets)
		line.strip!
		puts "<option value='#{line}'>#{line}</option>"
	end
end
