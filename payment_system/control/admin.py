from django.contrib import admin

# Register your models here.
from .models import CustomUser, DailyStoreSales, DurationRate, Store
from django.contrib.auth.admin import UserAdmin

admin.site.register(Store)
admin.site.register(DailyStoreSales)
admin.site.register(DurationRate)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # store フィールドを表示させたい場合は fieldsets に追加
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('store',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('store',)}),
    )