PREFIX = /usr

all:
	-@echo do nothing

install:
	install -Dm0644 tesliot.js -t $(DESTDIR)$(PREFIX)/share/wb-rules-system/rules
	install -Dm0755 tesliot.py -t $(DESTDIR)$(PREFIX)/lib/wb-ble-tesliot
	install -Dm0644 wb-ble-tesliot.conf -t $(DESTDIR)/etc
	install -Dm0644 46wb-ble-tesliot -t $(DESTDIR)/etc/wb-configs.d

clean:
	-@echo "do nothing"

.PHONY: all install clean
