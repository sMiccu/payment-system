from django.contrib import admin

# Register your models here.
from .models import DailyStoreSales, DurationRate, Store

admin.site.register(Store)
admin.site.register(DailyStoreSales)
admin.site.register(DurationRate)
