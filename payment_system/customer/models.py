from django.db import models
from control.models import Store

class Membership(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='membership')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.first_name + " " + self.last_name

# Create your models here.
#TODO: 顧客情報管理でなくて、入店してきた人を管理する
class Customer(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='customer')
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, null=True, related_name='customer')
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
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
