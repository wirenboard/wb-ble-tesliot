PREFIX = /usr

all:
	-@echo do nothing

install:
	install -Dm0644 tesliot.js $(DESTDIR)$(PREFIX)/share/wb-rules-system/rules
	install -Dm0755 tesliot.sh $(DESTDIR)$(PREFIX)/lib/wb-ble-tesliot
	install -Dm0644 wb-ble-tesliot.conf $(DESTDIR)$(PREFIX)/etc

clean:
	-@echo "do nothing"

.PHONY: all install clean
