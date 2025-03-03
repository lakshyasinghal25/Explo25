from django.contrib import admin
from .models import SentencePair, Alignment

admin.site.register(SentencePair)
admin.site.register(Alignment)