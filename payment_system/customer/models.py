from django.db import models
from control.models import Store
from phonenumber_field.modelfields import PhoneNumberField

class Membership(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    first_name_kana = models.CharField(max_length=100, null=True, blank=True)
    last_name_kana = models.CharField(max_length=100, null=True, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='membership')
    register_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.first_name + " " + self.last_name
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['store', 'phone_number'], name='unique_store_phone_number')
        ]

# Create your models here.
#TODO: 顧客情報管理でなくて、入店してきた人を管理する
class Customer(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='customer')
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, null=True, related_name='customer')
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class CustomerBreak(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.customer.name + " " + self.start_datetime.strftime("%Y-%m-%d %H:%M:%S") + " ~ " + self.end_datetime.strftime("%Y-%m-%d %H:%M:%S")
