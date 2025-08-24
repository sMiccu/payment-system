from django.contrib import admin

# Register your models here.
from .models import Customer, CustomerBreak, Membership

admin.site.register(Customer)
admin.site.register(CustomerBreak)
admin.site.register(Membership)
