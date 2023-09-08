PREFIX = /usr

all:
	-@echo do nothing

install:
	install -Dm0644 tesliot.js $(DESTDIR)$(PREFIX)/share/wb-rules-system/rules/tesliot.js
	install -Dm0755 tesliot.py -t $(DESTDIR)$(PREFIX)/lib/wb-ble-tesliot
	install -Dm0644 wb-ble-tesliot.conf $(DESTDIR)/etc/wb-ble-tesliot.conf
clean:
	-@echo "do nothing"

.PHONY: all install clean
