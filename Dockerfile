# Use uma imagem base com Ruby
FROM ruby:3.1

# Instalar dependências do sistema
RUN apt-get update -qq && \
    apt-get install -y \
    apache2 \
    libapache2-mod-passenger build-essential libssl-dev libreadline-dev zlib1g-dev

# Configurar o diretório de trabalho dentro do container
WORKDIR /var/www/html

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . /var/www/html

# Instalar as gems
RUN cd server &&  bundle install

# Configurar o Apache
RUN echo "PassengerRuby $(which ruby)" >> /etc/apache2/mods-available/passenger.conf

# Copiar e configurar o Virtual Host do Apache
COPY myapp.conf /etc/apache2/sites-available/myapp.conf
RUN a2ensite myapp \
    && a2enmod passenger \
    && service apache2 restart

# Expor a porta 80 para o Apache
EXPOSE 80

# Comando para iniciar o Apache
CMD ["/bin/bash", "/var/www/html/init.sh"]